using BladeWalker.Remake.Presentation;
using UnityEngine;

namespace BladeWalker.Remake.Combat
{
    public sealed class EnemyProjectile : MonoBehaviour
    {
        private HeroVitals _targetVitals;
        private Vector3 _velocity;
        private float _deathAt;

        public static void Spawn(Vector3 origin, Transform target, HeroVitals targetVitals, float speed, float yawOffset = 0f)
        {
            GameObject projectile = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            projectile.name = "EnemyCrystalProjectile";
            projectile.transform.position = origin;
            projectile.transform.localScale = Vector3.one * 0.28f;
            Collider colliderComponent = projectile.GetComponent<Collider>();
            if (colliderComponent != null) Object.Destroy(colliderComponent);

            Renderer rendererComponent = projectile.GetComponent<Renderer>();
            rendererComponent.material = MaterialFactory.Create(
                "Projectile",
                new Color(0.14f, 0.86f, 1f),
                0.15f,
                0.2f,
                new Color(0.1f, 1.5f, 2.4f));

            Vector3 direction = (target.position + Vector3.up - origin).normalized;
            direction = Quaternion.AngleAxis(yawOffset * Mathf.Rad2Deg, Vector3.up) * direction;
            EnemyProjectile shot = projectile.AddComponent<EnemyProjectile>();
            shot._targetVitals = targetVitals;
            shot._velocity = direction * speed;
            shot._deathAt = Time.time + 5f;
        }

        private void Update()
        {
            transform.position += _velocity * Time.deltaTime;
            transform.Rotate(180f * Time.deltaTime, 260f * Time.deltaTime, 0f, Space.World);

            if (_targetVitals != null && Vector3.Distance(transform.position, _targetVitals.transform.position + Vector3.up) < 0.75f)
            {
                _targetVitals.TryDamage(1);
                Destroy(gameObject);
            }
            else if (Time.time >= _deathAt)
            {
                Destroy(gameObject);
            }
        }
    }
}
